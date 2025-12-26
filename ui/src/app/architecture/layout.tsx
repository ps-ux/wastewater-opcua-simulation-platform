// Architecture section layout - no sidebar for fullscreen presentations

export default function ArchitectureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout bypasses the AppLayout to provide fullscreen content
  return <>{children}</>;
}
