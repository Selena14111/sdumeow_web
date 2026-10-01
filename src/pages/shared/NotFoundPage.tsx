import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <Result
        extra={<Button onClick={() => navigate('/')}>Back Home</Button>}
        status="404"
        subTitle="The page you requested does not exist."
        title="404"
      />
    </div>
  )
}
