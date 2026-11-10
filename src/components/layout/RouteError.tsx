import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

export function RouteLoading() {
  return <p className="p-4 text-sm text-muted-foreground">Wczytywanie…</p>
}

export function RouteError() {
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-lg font-semibold">{notFound ? 'Nie ma takiej strony' : 'Wystąpił błąd'}</h1>
      <p className="text-sm text-muted-foreground">
        {notFound
          ? 'Adres nie odpowiada żadnemu widokowi aplikacji.'
          : error instanceof Error
            ? error.message
            : 'Nie udało się wyświetlić widoku.'}
      </p>
      <Link to="/przeglad" className="text-sm underline">
        Wróć do przeglądu
      </Link>
    </div>
  )
}
