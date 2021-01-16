import React from 'react'
import { Card } from '@lib/components'
import { Welcome } from '../components'
import { sayHello } from '../utils'

export default function () {
  return (
    <Card>
      <Welcome title={sayHello()} />
    </Card>
  )
}
