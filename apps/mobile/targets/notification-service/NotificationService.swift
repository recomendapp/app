import UserNotifications
import Intents

// Reads the image keys the backend puts at the top level of the push
// payload (see apps/notify/src/app/apns/apns.service.ts):
// - avatarUrl (+ senderName/senderId): follow notifications. Turns the
//   notification into a Communication Notification, showing the actor's
//   avatar in place of the app icon (which shrinks to a small badge).
// - attachmentUrl: reco notifications. A plain UNNotificationAttachment,
//   shown as a thumbnail on the trailing edge of the notification.
class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?

    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.contentHandler = contentHandler
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)

        guard let bestAttemptContent = bestAttemptContent else {
            contentHandler(request.content)
            return
        }

        let userInfo = request.content.userInfo
        let avatarUrl = (userInfo["avatarUrl"] as? String).flatMap(URL.init(string:))
        let attachmentUrl = (userInfo["attachmentUrl"] as? String).flatMap(URL.init(string:))

        guard avatarUrl != nil || attachmentUrl != nil else {
            contentHandler(bestAttemptContent)
            return
        }

        // Both fetched in parallel and applied together: they come from
        // different notification types (follow vs. reco) in practice, but
        // nothing stops both being present on the same push.
        let group = DispatchGroup()
        var avatarData: Data?
        var attachment: UNNotificationAttachment?

        if let avatarUrl = avatarUrl {
            group.enter()
            downloadImageData(from: avatarUrl) { data in
                avatarData = data
                group.leave()
            }
        }

        if let attachmentUrl = attachmentUrl {
            group.enter()
            downloadAttachment(from: attachmentUrl, identifier: "attachment") { result in
                attachment = result
                group.leave()
            }
        }

        group.notify(queue: .main) { [weak self] in
            guard let self = self else {
                contentHandler(bestAttemptContent)
                return
            }

            if let attachment = attachment {
                bestAttemptContent.attachments = [attachment]
            }

            guard let avatarData = avatarData else {
                contentHandler(bestAttemptContent)
                return
            }
            contentHandler(self.makeCommunicationContent(from: request, baseContent: bestAttemptContent, avatarData: avatarData))
        }
    }

    override func serviceExtensionTimeWillExpire() {
        // Called just before the extension will be terminated by the system.
        // Deliver whatever we have so far rather than nothing.
        if let contentHandler = contentHandler, let bestAttemptContent = bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
    }

    // Communication Notifications show the sender's avatar in place of the
    // app icon, with a small app badge. A plain UNNotificationAttachment
    // only adds a thumbnail beside the text; this is a separate, dedicated
    // iOS 15+ API. Requires the "Communication Notifications" capability
    // (com.apple.developer.usernotifications.communication) on the host app
    // only — Apple rejects it as an invalid entitlement on this extension's
    // App ID — plus INSendMessageIntent declared in both Info.plists — see
    // targets/notification-service/Info.plist and app.config.ts's
    // ios.infoPlist.NSUserActivityTypes / ios.entitlements.
    //
    // Setting `attachments` on baseContent before calling updating(from:)
    // (see didReceive) carries it through: this only adds sender identity
    // on top of the existing content, it doesn't replace it.
    private func makeCommunicationContent(
        from request: UNNotificationRequest,
        baseContent: UNMutableNotificationContent,
        avatarData: Data
    ) -> UNNotificationContent {
        let userInfo = request.content.userInfo
        // Stable per-actor identity so repeated notifications from the same
        // person group under the same "conversation" instead of each
        // becoming its own thread.
        let senderId = userInfo["senderId"] as? String ?? UUID().uuidString
        let senderName = userInfo["senderName"] as? String ?? baseContent.title
        baseContent.threadIdentifier = senderId

        let avatar = INImage(imageData: avatarData)
        let sender = INPerson(
            personHandle: INPersonHandle(value: senderId, type: .unknown),
            nameComponents: nil,
            displayName: senderName,
            image: avatar,
            contactIdentifier: nil,
            customIdentifier: nil
        )

        let intent = INSendMessageIntent(
            recipients: nil,
            outgoingMessageType: .outgoingMessageText,
            content: baseContent.body,
            speakableGroupName: nil,
            conversationIdentifier: senderId,
            serviceName: nil,
            sender: sender,
            attachments: nil
        )

        guard let updatedContent = try? baseContent.updating(from: intent) else {
            return baseContent
        }
        return updatedContent
    }

    private func downloadImageData(from url: URL, completion: @escaping (Data?) -> Void) {
        URLSession.shared.dataTask(with: url) { data, _, error in
            completion(error == nil ? data : nil)
        }.resume()
    }

    private func downloadAttachment(from url: URL, identifier: String, completion: @escaping (UNNotificationAttachment?) -> Void) {
        URLSession.shared.downloadTask(with: url) { location, _, error in
            guard let location = location, error == nil else {
                completion(nil)
                return
            }

            let fileManager = FileManager.default
            let tmpDirectory = fileManager.temporaryDirectory.appendingPathComponent(UUID().uuidString)
            do {
                try fileManager.createDirectory(at: tmpDirectory, withIntermediateDirectories: true)
                // UNNotificationAttachment infers its type from the local
                // file's extension, not from the source URL or the HTTP
                // Content-Type header. TMDB poster URLs already end in
                // .jpg; fall back to .jpg for anything extensionless.
                let ext = url.pathExtension.isEmpty ? "jpg" : url.pathExtension
                let fileURL = tmpDirectory.appendingPathComponent(identifier).appendingPathExtension(ext)
                try fileManager.moveItem(at: location, to: fileURL)
                let attachment = try UNNotificationAttachment(identifier: identifier, url: fileURL)
                completion(attachment)
            } catch {
                completion(nil)
            }
        }.resume()
    }

}
