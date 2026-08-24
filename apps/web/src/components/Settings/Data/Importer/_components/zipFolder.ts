import JSZip from 'jszip';

export async function zipDirectoryFiles(fileList: FileList, zipName: string): Promise<File> {
  const zip = new JSZip();

  for (const file of Array.from(fileList)) {
    const relativePath = file.webkitRelativePath.split('/').slice(1).join('/') || file.name;
    zip.file(relativePath, file);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  return new File([blob], zipName, { type: 'application/zip' });
}
