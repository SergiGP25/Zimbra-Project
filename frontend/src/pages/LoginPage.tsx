import React from 'react'
import { LoginForm } from '../components/auth/LoginForm'

export const LoginPage: React.FC = () => {
  return (
    <div className="login-page-container">
      <div className="login-wrapper">
        <LoginForm />
      </div>
    </div>
  )
}

