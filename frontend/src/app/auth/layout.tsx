export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-col">{children}</div>
  );
}