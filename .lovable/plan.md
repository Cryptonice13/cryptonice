

## Plan: User Profile Side Sheet from Community Posts

### Overview
Add a clickable profile entry point on community posts (and comments). Clicking a user's avatar/name opens a right-side `Sheet` showing their profile with quick actions: send friend request, message, and view their post stats. Wire the "Message" action so it switches to the Messages tab and opens that conversation.

### Changes

#### 1. Create `src/components/community/UserProfileSheet.tsx` (new)
A controlled `Sheet` (right side) that takes `userId`, `open`, `onOpenChange`, and `onMessage(friendId, name)` props.

Inside the sheet:
- **Header**: Large avatar (initials fallback), display name, email
- **Stats row**: Posts count, Friends count (queried from `community_posts` and `friendships` where status = 'accepted')
- **Recent posts preview**: Last 3 posts by this user from `community_posts` (content snippet + timestamp)
- **Action buttons** (conditional on relationship state from `useFriends`):
  - If viewing own profile: just shows "This is you"
  - If not friends and no pending request: **Add Friend** button (calls `sendRequest`)
  - If pending request sent by current user: **Request Sent** (disabled)
  - If pending request received: **Accept** / **Reject** buttons
  - If already friends: **Message** button (calls `onMessage` -> closes sheet, switches to Messages tab, opens chat)
- **Close** button (built into Sheet)

Data fetching: single `useEffect` on `userId` change loads profile, post count, friend count, recent posts from Supabase.

#### 2. Update `src/pages/Community.tsx`
- Lift tab state to controlled `Tabs` with `value`/`onValueChange` so we can switch programmatically
- Add state: `profileUserId` (for the sheet) and `pendingChatFriend` (to auto-open a chat in Messages tab)
- In `FeedTab`: make the avatar + user name in the post header clickable (cursor-pointer, calls `onOpenProfile(post.user_id)`); same for comment author
- Pass `onOpenProfile` callback from `Community` down to `FeedTab` via prop
- In `MessagesTab`: accept `initialFriend?: { id; name }` prop; when set, auto-set `activeFriend` on mount
- Render `<UserProfileSheet>` at the `Community` page level so it overlays all tabs
- The sheet's `onMessage` handler: sets `pendingChatFriend`, switches `tab` to `'messages'`, closes sheet

#### 3. Minor: friendship-state helper
In `UserProfileSheet`, derive relationship status from `useFriends`'s `friends` and `pending` arrays (no new hook needed). For the "request sent by me" case, check `pending.find(f => f.requester_id === currentUserId && f.addressee_id === profileUserId)`.

### Files
| File | Action |
|---|---|
| `src/components/community/UserProfileSheet.tsx` | Create -- profile sheet with stats, recent posts, action buttons |
| `src/pages/Community.tsx` | Modify -- controlled tabs, clickable post authors, render sheet, wire message handoff |

### Notes
- No DB schema changes needed -- all required tables (`profiles`, `community_posts`, `friendships`, `direct_messages`) already exist with proper RLS.
- The Messages tab already supports opening a conversation by friend; we just feed it an initial friend.
- Sheet uses existing `@/components/ui/sheet` (already imported in the project).

