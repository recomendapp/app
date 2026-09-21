// Integration specs instantiate services directly, without bootstrapping the
// Nest configuration module. Asset DTO transforms still need a public S3 URL.
process.env.S3_PUBLIC_ENDPOINT ??= 'https://cdn.test';
process.env.S3_BUCKET ??= 'medias';
