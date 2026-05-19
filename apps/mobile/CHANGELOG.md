# mobile

## [2.0.0](https://github.com/recomendapp/app/compare/mobile-v1.1.0...mobile-v2.0.0) (2026-05-19)


### ⚠ BREAKING CHANGES

* **rich-text:** Review body storage format shifted from HTML to Markdown. Existing records may require migration to render correctly.
* **notify:** The push token registration endpoint moved from /user/me/push-token to /me/push-token

### Features

* **api:** add movie and tv-series image endpoints ([7f9ceba](https://github.com/recomendapp/app/commit/7f9cebab51fe289d3a6d912e634c4a2c8b8ce9bc))
* **api:** implement RevenueCat webhook sync ([9fa58c3](https://github.com/recomendapp/app/commit/9fa58c30b6babdee61b360bc6187b425e154f436))
* **app:** enable scheduling and fix upgrade logic ([0322203](https://github.com/recomendapp/app/commit/0322203019643e4f97e7e96af2a361925ab72997))
* **auth:** replace Supabase with custom auth ([99304a3](https://github.com/recomendapp/app/commit/99304a351b565d514da99f0334895bd4de1152f4))
* consolidate media mutations, add profile/review screens & bottom sheets ([05ade03](https://github.com/recomendapp/app/commit/05ade03ca06a587ca0f77abbf833c5fa22eb38b1))
* enable APNS and fix mobile auth redirect ([432fc2c](https://github.com/recomendapp/app/commit/432fc2c319bd33594a9c0fb3b1ae03acfa2f9492))
* **feed:** add dedicated user feed endpoints ([8fe24c0](https://github.com/recomendapp/app/commit/8fe24c0abcd79d9c6121708e18c5482f92e9d648))
* improve empty state UI and data handling ([b63f0f4](https://github.com/recomendapp/app/commit/b63f0f4310b45651dd1e511c649963f385c4e26d))
* **mobile:** add maplibre and update tracking ([755d076](https://github.com/recomendapp/app/commit/755d0762321a98410c37eecb1b2c1bf4e9dc6366))
* **mobile:** add OTA updates and refactor imports ([8b9023f](https://github.com/recomendapp/app/commit/8b9023f88334cc930313867f1a1bcbba7b5a1b7d))
* **mobile:** enhance error handling and upgrade UI ([8a30bae](https://github.com/recomendapp/app/commit/8a30baef83d21ec513396baf0a474f29c5bcf424))
* **mobile:** implement native facebook login ([e50f216](https://github.com/recomendapp/app/commit/e50f2168ec4e15852b75c0f21efcb273df9a216a))
* **mobile:** integrate expo app into nx monorepo ([7f9ceba](https://github.com/recomendapp/app/commit/7f9cebab51fe289d3a6d912e634c4a2c8b8ce9bc))
* **notify:** add deep linking and rich payloads ([0af632d](https://github.com/recomendapp/app/commit/0af632d1171a9dc215eb63a6ed080b8ab689745e))
* **rich-text:** migrate from HTML to Markdown ([9f820ac](https://github.com/recomendapp/app/commit/9f820ac666c0fbf151e749afa173131e9f6650ac))
* saveeeeeeeeeee ([a40291c](https://github.com/recomendapp/app/commit/a40291c355238620c1982fcb5d3c817bc414324a))
* **users:** unify cache updates and add optimistic follow ([27a2116](https://github.com/recomendapp/app/commit/27a21169900830ffb89684246c18553c3733b5f9))


### Bug Fixes

* **auth:** implement social login flow for mobile ([b4de39d](https://github.com/recomendapp/app/commit/b4de39d3628bb50b3492b83e4485b4f086bc127d))
* **mobile:** display detailed error message in search results ([5a08842](https://github.com/recomendapp/app/commit/5a088425d9b13261ba17bc853e4dacec3f041891))

## 1.1.0

### Minor Changes

- 1d06a5d: feat: migrate text editor to native Markdown using react-native-enriched-markdown, replacing HTML for better performance and native rendering.
