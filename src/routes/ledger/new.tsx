import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/ledger/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/ledger/new"!</div>
}
