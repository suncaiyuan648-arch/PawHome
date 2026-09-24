export interface CommentItemAuthor {
  pawId?: string
  name?: string
  avatar?: string
  level?: number | string
  owner?: boolean
  tag?: string
}

export interface CommentItemRecord {
  id: string
  author?: CommentItemAuthor
  name?: string
  avatar?: string
  level?: number | string
  copy?: string
  text?: string
  meta?: string
  likes?: number | string
  liked?: boolean
  kind?: string
  duration?: number | string
  voiceBars?: number[]
  owner?: boolean
  authorTag?: string
  replyTo?: { name: string; level?: number | string }
  children?: CommentItemRecord[]
}

export interface CommentProfileIdentity {
  pawId: string
  name?: string
  avatar?: string
}

/** Support both the current nested author and legacy comments with author fields inline. */
export function commentProfileIdentity(comment: CommentItemRecord): CommentProfileIdentity {
  if (comment.author) {
    return {
      pawId: comment.author.pawId || comment.id,
      name: comment.author.name,
      avatar: comment.author.avatar,
    }
  }
  return { pawId: comment.id, name: comment.name, avatar: comment.avatar }
}

export interface CommentItemState {
  repliesExpanded: boolean
}
export interface CommentThreadState {
  commentsExpanded: boolean
  playingId: string | null
}

export function findCommentById<T extends { id: string; children?: T[] }>(
  comments: readonly T[],
  id: string,
): T | null {
  for (const comment of comments) {
    if (comment.id === id) return comment
    const child = findCommentById(comment.children || [], id)
    if (child) return child
  }
  return null
}
