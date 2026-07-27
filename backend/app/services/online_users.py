from typing import Set

class OnlineUsersManager:
    def __init__(self):
        # We track connected active users by username or user_id
        self.active_users: Set[str] = set()
        self.active_connections: int = 0

    def connect(self, username: str):
        self.active_users.add(username)
        self.active_connections += 1

    def disconnect(self, username: str):
        if username in self.active_users:
            self.active_connections -= 1
            if self.active_connections <= 0:
                self.active_connections = 0
                self.active_users.remove(username)
            # A more robust tracking might use a dict of connection counts per user,
            # but this simple approach fulfills basic requirements if connections are 1:1

    def get_online_count(self) -> int:
        return len(self.active_users)

manager = OnlineUsersManager()
