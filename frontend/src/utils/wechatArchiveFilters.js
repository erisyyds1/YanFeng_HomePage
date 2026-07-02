export const WECHAT_ARCHIVE_PAGE_SIZE = 8;

export const getWechatArticleDisplaySource = (article) =>
  article?.displaySourceName || article?.sourceName || '涧桐现视研';

export const paginateWechatArticles = (articles, sourceName, page, pageSize = WECHAT_ARCHIVE_PAGE_SIZE) => {
  const sourceArticles = sourceName
    ? articles.filter((article) => getWechatArticleDisplaySource(article) === sourceName)
    : articles;
  const totalItems = sourceArticles.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const requestedPage = Number.isFinite(Number(page)) ? Math.trunc(Number(page)) : 1;
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;

  return {
    items: sourceArticles.slice(startIndex, startIndex + pageSize),
    totalItems,
    totalPages,
    currentPage
  };
};

export const getWechatArchivePageButtons = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const page = Math.min(Math.max(currentPage, 1), totalPages);
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  const buttons = [1];

  if (start > 2) {
    buttons.push('ellipsis-left');
  }

  for (let nextPage = start; nextPage <= end; nextPage += 1) {
    buttons.push(nextPage);
  }

  if (end < totalPages - 1) {
    buttons.push('ellipsis-right');
  }

  buttons.push(totalPages);
  return buttons;
};
