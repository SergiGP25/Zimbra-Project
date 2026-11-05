export interface HealthResponse {
  status: string
  service: string
  version: string
  zimbra_target: string
}

export interface LoginResponse {
  auth_token: string
  lifetime?: number
  email?: string
  message: string
}

export interface MailMessage {
  id: string
  subject: string
  sender: string
  date: string
  fragment?: string
  is_unread: boolean
}

export interface MailListResponse {
  total: number
  messages: MailMessage[]
}

export interface SendMailPayload {
  to: string[]
  subject: string
  content: string
  is_html?: boolean
}

