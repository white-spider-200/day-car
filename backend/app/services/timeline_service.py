from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import Post, PostLike, User, UserRole


def create_post(db: Session, *, doctor_user: User, content: str) -> Post:
    if doctor_user.role != UserRole.DOCTOR:
        raise PermissionError("Only doctors can create posts")
    post = Post(doctor_id=doctor_user.id, content=content.strip())
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def list_posts_with_stats(db: Session, *, actor_user_id=None) -> list[dict]:
    posts = list(db.scalars(select(Post).order_by(Post.created_at.desc()).limit(100)))
    if not posts:
        return []

    post_ids = [post.id for post in posts]
    likes_rows = db.execute(
        select(PostLike.post_id, func.count(PostLike.id))
        .where(PostLike.post_id.in_(post_ids))
        .group_by(PostLike.post_id)
    ).all()
    likes_map = {row[0]: int(row[1]) for row in likes_rows}

    liked_set: set = set()
    if actor_user_id is not None:
        liked_rows = db.execute(
            select(PostLike.post_id).where(PostLike.post_id.in_(post_ids), PostLike.user_id == actor_user_id)
        ).all()
        liked_set = {row[0] for row in liked_rows}

    output: list[dict] = []
    for post in posts:
        output.append(
            {
                "id": post.id,
                "doctor_id": post.doctor_id,
                "content": post.content,
                "created_at": post.created_at,
                "likes_count": likes_map.get(post.id, 0),
                "liked_by_me": post.id in liked_set,
            }
        )
    return output


def like_post(db: Session, *, post_id, actor_user: User) -> tuple[PostLike, int]:
    existing = db.scalar(select(PostLike).where(PostLike.post_id == post_id, PostLike.user_id == actor_user.id))
    if existing:
        likes_count = db.scalar(select(func.count(PostLike.id)).where(PostLike.post_id == post_id)) or 0
        return existing, int(likes_count)

    like = PostLike(post_id=post_id, user_id=actor_user.id)
    db.add(like)
    db.commit()
    db.refresh(like)

    likes_count = db.scalar(select(func.count(PostLike.id)).where(PostLike.post_id == post_id)) or 0
    return like, int(likes_count)
