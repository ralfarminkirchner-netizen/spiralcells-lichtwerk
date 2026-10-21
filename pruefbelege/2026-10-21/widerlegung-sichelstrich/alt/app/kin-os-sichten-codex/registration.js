// Öffnet die gespeicherte eigene Fassung und die unveränderte Vorlage.
const ownMaterialUrl="http://127.0.0.1:8401/#material=%7B%22variantId%22%3A%22cf7b3a6e-d70a-4732-953a-05e9d99a9b40%22%2C%22comparisonId%22%3A%22ed1c07b1-50d7-4779-8cca-0776179079b2%22%7D";
for (const link of document.querySelectorAll('#saved-link')) link.href=ownMaterialUrl;
