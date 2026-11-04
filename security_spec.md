# Security Specification

## Data Invariants
1. Only authenticated users with verified Google accounts can access resources.
2. The user `cleefordtayaban6@gmail.com` is the system root administrator with exclusive access to modify user roles, permissions, and view all system collections.
3. Users can read and update their own profile document `/users/{userId}` where `userId == request.auth.uid`, but cannot self-promote to 'admin'.
4. Screen sessions `/sessions/{sessionId}` can be created and managed by the session host or administrators.
5. Captures `/sessions/{sessionId}/captures/{captureId}` can be created by authenticated session participants or admins.
6. Blanket reads are forbidden; queries must be guarded by ownership or admin status.
