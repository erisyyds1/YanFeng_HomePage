import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  WECHAT_ARCHIVE_PAGE_SIZE,
  getWechatArticleDisplaySource,
  paginateWechatArticles
} from '../frontend/src/utils/wechatArchiveFilters.js';

const componentSource = readFileSync(new URL('../frontend/src/components/WechatArchive.tsx', import.meta.url), 'utf8');

const makeArticle = (id, sourceName, displaySourceName = '') => ({
  id: String(id),
  title: `文章 ${id}`,
  summary: '摘要',
  coverUrl: '',
  wechatUrl: `https://mp.weixin.qq.com/s/${id}`,
  publishedAt: '2026-07-02',
  isPublished: true,
  sortOrder: 0,
  sourceName,
  displaySourceName
});

const articles = [
  ...Array.from({ length: 9 }, (_, index) => makeArticle(`jt-${index}`, '番剧鉴赏组', '涧桐现视研')),
  ...Array.from({ length: 3 }, (_, index) => makeArticle(`yf-${index}`, '檐枫动漫社'))
];

assert.equal(WECHAT_ARCHIVE_PAGE_SIZE, 8);
assert.equal(getWechatArticleDisplaySource(makeArticle('a', '番剧鉴赏组', '涧桐现视研')), '涧桐现视研');
assert.equal(getWechatArticleDisplaySource(makeArticle('b', '檐枫动漫社')), '檐枫动漫社');

const firstPage = paginateWechatArticles(articles, '涧桐现视研', 1);
assert.equal(firstPage.totalItems, 9);
assert.equal(firstPage.totalPages, 2);
assert.equal(firstPage.currentPage, 1);
assert.equal(firstPage.items.length, 8);
assert.deepEqual(firstPage.items.map((item) => item.id), [
  'jt-0',
  'jt-1',
  'jt-2',
  'jt-3',
  'jt-4',
  'jt-5',
  'jt-6',
  'jt-7'
]);

const secondPage = paginateWechatArticles(articles, '涧桐现视研', 2);
assert.equal(secondPage.items.length, 1);
assert.deepEqual(secondPage.items.map((item) => item.id), ['jt-8']);

const overMaxPage = paginateWechatArticles(articles, '檐枫动漫社', 9);
assert.equal(overMaxPage.totalItems, 3);
assert.equal(overMaxPage.totalPages, 1);
assert.equal(overMaxPage.currentPage, 1);
assert.deepEqual(overMaxPage.items.map((item) => item.id), ['yf-0', 'yf-1', 'yf-2']);

assert.match(componentSource, /aria-label="公众号来源切换"/);
assert.match(componentSource, /className="flex flex-wrap justify-end gap-2"/);
assert.match(componentSource, /border-4 px-5 py-3 text-sm font-black tracking-\[0\.18em\]/);
assert.doesNotMatch(componentSource, /labelEn/);
assert.doesNotMatch(componentSource, /sourceCounts/);
assert.doesNotMatch(componentSource, /篇推文/);
assert.doesNotMatch(componentSource, /共 \{pagination\.totalItems\} 篇/);
assert.doesNotMatch(componentSource, /\{activeSource\}：每页/);
assert.match(componentSource, /aria-label="跳转页码"/);
assert.match(componentSource, /跳转\s*<\/button>/);

console.log('wechat archive pagination tests passed');
