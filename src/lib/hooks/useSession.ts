// hooks/useSession.ts
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useSession() {
  const { data, error, isLoading, mutate } = useSWR('/api/auth/session', fetcher);

  return {
    user: data?.user,
    isLoading,
    isError: error,
    mutate, // useful for refreshing session after login/logout
  };
}
