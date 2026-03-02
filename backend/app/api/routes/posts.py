import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.db.models import Post, User, UserRole
from app.db.session import get_db
from app.schemas.post import PostCreateIn, PostOut, TimelinePostOut
from app.services.timeline_service import create_post, like_post, list_posts_with_stats

router = APIRouter(tags=["posts"])


@router.post("/posts", response_model=PostOut)
def publish_post(
    payload: PostCreateIn,
    current_user: User = Depends(require_roles(UserRole.DOCTOR)),
    db: Session = Depends(get_db),
):
    post = create_post(db, doctor_user=current_user, content=payload.content)
    return PostOut.model_validate(post)


@router.get("/posts", response_model=list[TimelinePostOut])
def list_posts(db: Session = Depends(get_db)):
    rows = list_posts_with_stats(db, actor_user_id=None)
    return [TimelinePostOut.model_validate(item) for item in rows]


@router.post("/posts/{post_id}/like")
def like_public_post(
    post_id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.USER, UserRole.DOCTOR, UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    post = db.scalar(select(Post).where(Post.id == post_id))
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    _, likes_count = like_post(db, post_id=post_id, actor_user=current_user)
    return {"post_id": post_id, "likes_count": likes_count}
