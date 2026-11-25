import { Button, Container, PageTitle } from "@/components/ui";

export default async function Page({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  return (
    <Container className="pb-32 pt-16 text-center">
      <p className="mb-3 text-sm text-black/50">Замовлення №{n}</p>
      <PageTitle>Дякуємо!</PageTitle>
      <p className="mx-auto mt-4 max-w-md text-base font-medium text-mute">
        Ми отримали ваше замовлення та зв’яжемось для підтвердження.
      </p>
      <div className="mt-10">
        <Button href="/" variant="solid">
          На головну
        </Button>
      </div>
    </Container>
  );
}
