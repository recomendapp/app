const generatePaginationNumbers = (page: number, totalPages: number): (number | string)[] => {
	const pages: (number | string)[] = [];

	// Ajouter toujours la première page
	if (page > 2) pages.push(1);
	if (page > 3) pages.push("...");

	// Pages autour de la page active
	for (let i = Math.max(1, page - 1); i <= Math.min(totalPages, page + 1); i++) {
	  pages.push(i);
	}

	// Ajouter toujours la dernière page
	if (page < totalPages - 2) pages.push("...");
	if (page < totalPages - 1) pages.push(totalPages);

	return pages;
};

export {
	generatePaginationNumbers
}