import React from 'react'
import { Card } from '@lib/components'
import { useClientRequest } from '@lib/utils/useClientRequest'
import client from '@lib/client'

import { Welcome } from '../components'

export default function () {
  const { data: hello } = useClientRequest(() =>
    client.getInstance().__APP_NAME__HelloGet('__APP_NAME__')
  )

  return (
    <Card>
      <Welcome title={hello?.echo || 'Welcome'} />
      <img src="https://source.unsplash.com/featured/?hackathon" />
    </Card>
  )
}
