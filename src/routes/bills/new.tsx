import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/bills/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/bills/new"!</div>
}
