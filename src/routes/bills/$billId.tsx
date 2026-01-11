import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/bills/$billId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/bills/$billId"!</div>
}
