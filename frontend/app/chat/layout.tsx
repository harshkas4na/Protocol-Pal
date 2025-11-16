"use client";

import { ThirdwebProvider } from "thirdweb/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>
          <QueryClientProvider client={queryClient}>
          <ThirdwebProvider>{children} </ThirdwebProvider>
          </QueryClientProvider>
         </>
}
