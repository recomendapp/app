/*
* Function to import SVG files in maplibre-gl
*/

export const importSvg = (map: any, name: string, url: string, options: { width?: number, height?: number }) => {
	const { width = 8, height = 8 } = options; 
	const img = new Image(options.width, options.height);
	img.onload = () => map.addImage(name, img);
	img.src = url;
};