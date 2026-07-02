from core.models.article import Article,DATA_STATUS
import core.db as db
from core.config import cfg
from core.wait import Wait
from core.print import print_success,print_error,print_warning
from core.article_content import build_article_url, sync_article_content
DB=db.Db(tag="内容修正")
def fetch_articles_without_content():
    """
    查询content为空的文章，调用微信内容提取方法获取内容并更新数据库
    使用 FETCHING 状态锁定，防止多节点同时获取相同数据
    """
    session = DB.get_session()
    try:
        # 查询content为空且未被锁定的文章
        from sqlalchemy import or_
        articles = session.query(Article).filter(
            or_(Article.has_content==0),
            Article.status != DATA_STATUS.FETCHING,  # 排除正在获取的文章
            Article.status != DATA_STATUS.DELETED,  # 已删除文章不再参与自动补抓
            or_(Article.fix_fail_count.is_(None), Article.fix_fail_count < 3)  # 排除失败3次及以上的文章
        ).order_by(Article.publish_time.desc()).limit(10).all()
        
        if not articles:
            print_warning("暂无需要获取内容的文章")
            return

        original_status_map = {
            article.id: article.status for article in articles
        }
        
        # 锁定文章状态，防止其他节点获取
        article_ids = [a.id for a in articles]
        session.query(Article).filter(Article.id.in_(article_ids)).update(
            {Article.status: DATA_STATUS.FETCHING},
            synchronize_session=False
        )
        session.commit()
        
        for article in articles:
            try:
                url = build_article_url(article)
                print(f"正在处理文章: {article.title}, URL: {url}")
                
                # 获取内容
                updated, fetch_mode = sync_article_content(
                    session=session,
                    article=article,
                    preferred_mode=cfg.get("gather.content_mode", "web"),
                )
                if updated:
                    if article.status == DATA_STATUS.DELETED:
                        print_error(f"获取文章 {article.title} 内容已被发布者删除")
                    else:
                        print_success(f"成功更新文章 {article.title} 的内容, mode={fetch_mode} url: http://127.0.0.1:{cfg.get('port', 8001)}/views/article/{article.id}")
                        # 成功获取内容后，恢复原始状态（通常为 ACTIVE），释放 FETCHING 锁
                        article.status = original_status_map.get(article.id, DATA_STATUS.ACTIVE)
                        session.commit()
                else:
                    # 获取失败，恢复状态以便后续重试
                    article.status = original_status_map.get(article.id, DATA_STATUS.ACTIVE)
                    session.commit()
                    print_error(f"获取文章 {article.title} 内容失败, mode={fetch_mode}")
                Wait(min=5,max=10,tips=f"修正 {article.title}... 完成")
            except Exception as e:
                # 单篇文章处理失败，恢复状态
                article.status = original_status_map.get(article.id, DATA_STATUS.ACTIVE)
                session.commit()
                print_error(f"处理文章 {article.title} 时发生错误: {e}")
    except Exception as e:
        print_error(f"处理过程中发生错误: {e}")
        raise  # 重新抛出异常，让队列记录错误
    finally:
        session.close()
from core.task import TaskScheduler
from core.queue import ContentTaskQueue

scheduler = TaskScheduler()
def start_sync_content():
    """
    根据配置自动启动文章内容同步任务
    
    功能：
    - 检查是否启用了自动同步功能
    - 根据配置的间隔时间设置定时任务
    - 清除现有任务队列和调度器中的所有作业
    - 添加新的定时同步任务并启动调度器
    - 立即执行一次同步任务
    
    Args:
        无显式参数，从配置中读取以下设置：
        - gather.content_auto_check: 是否启用自动同步功能
        - gather.content_auto_interval: 同步间隔时间（分钟）
    
    Returns:
        None
    
    Raises:
        无显式异常抛出，但内部可能打印警告或成功信息
    """
    if not cfg.get("gather.content_auto_check",False):
        print_warning("自动检查并同步文章内容功能未启用")
        return
    interval=int(cfg.get("gather.content_auto_interval",10)) # 每隔多少分钟
    cron_exp=f"*/{interval} * * * *"
    # ContentTaskQueue.clear_queue()  # 已注释：避免清空消息任务队列
    scheduler.clear_all_jobs()
    def do_sync():
        ContentTaskQueue.add_task(fetch_articles_without_content, task_name="补抓文章内容")
    job_id=scheduler.add_cron_job(do_sync,cron_expr=cron_exp)
    print_success(f"已添自动同步文章内容任务: {job_id}")
    scheduler.start()
    # 立即执行一次
    do_sync()
    print_success("已添加首次执行任务到队列")
if __name__ == "__main__":
    fetch_articles_without_content()
