from typing import List, Optional
from pydantic import BaseModel


class EmailAddress(BaseModel):
    name: Optional[str] = None
    email: str


class SendMailRequest(BaseModel):
    to: List[str]
    subject: str
    content: str
    is_html: bool = False
    cc: Optional[List[str]] = None
    bcc: Optional[List[str]] = None


class MailMessageSummary(BaseModel):
    id: str
    subject: str
    sender: str
    date: str
    fragment: Optional[str] = None
    is_unread: bool = True


class MailListResponse(BaseModel):
    total: int
    messages: List[MailMessageSummary]

