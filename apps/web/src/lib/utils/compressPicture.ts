import Compressor from 'compressorjs';

export default function compressPicture(
  file: File,
  width: number,
  height: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      quality: 1,
      resize: 'cover',
      convertTypes: ['image/png', 'image/webp'],
      convertSize: 0,
      width: width,
      height: height,
      success: (compressedImage) => {
        const image = new File([compressedImage], file.name, {
          type: compressedImage.type,
        });
        resolve(image);
      },
      error: (err) => {
        reject(err);
      },
    });
  });
}
