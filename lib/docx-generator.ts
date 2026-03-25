import type { Contract } from './types'

export async function generateContractDocx(contract: Contract) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } =
    await import('docx')
  const { saveAs } = await import('file-saver')

  const data = JSON.parse(contract.data_json || '{}')
  const today = new Date()
  const dateStr = `Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`

  const fieldParagraphs = Object.entries(data).map(
    ([key, value]) =>
      new Paragraph({
        children: [
          new TextRun({ text: `${key}: `, bold: true, font: 'Times New Roman', size: 24 }),
          new TextRun({ text: String(value), font: 'Times New Roman', size: 24 }),
        ],
        spacing: { after: 200 },
      })
  )

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
                bold: true,
                font: 'Times New Roman',
                size: 26,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Độc lập - Tự do - Hạnh phúc',
                bold: true,
                font: 'Times New Roman',
                size: 26,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: contract.template_name.toUpperCase(),
                bold: true,
                font: 'Times New Roman',
                size: 32,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Số: ${contract.contract_no}`,
                font: 'Times New Roman',
                size: 24,
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: dateStr,
                font: 'Times New Roman',
                size: 24,
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Customer info
          new Paragraph({
            children: [
              new TextRun({
                text: 'THÔNG TIN KHÁCH HÀNG',
                bold: true,
                font: 'Times New Roman',
                size: 26,
              }),
            ],
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Tên công ty: ', bold: true, font: 'Times New Roman', size: 24 }),
              new TextRun({
                text: contract.customer_name || contract.company_name,
                font: 'Times New Roman',
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Dynamic fields
          new Paragraph({
            children: [
              new TextRun({
                text: 'NỘI DUNG HỢP ĐỒNG',
                bold: true,
                font: 'Times New Roman',
                size: 26,
              }),
            ],
            spacing: { before: 400, after: 200 },
          }),
          ...fieldParagraphs,

          // Signatures
          new Paragraph({
            children: [
              new TextRun({
                text: 'CHỮ KÝ CÁC BÊN',
                bold: true,
                font: 'Times New Roman',
                size: 26,
              }),
            ],
            spacing: { before: 800, after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'BÊN A',
                bold: true,
                font: 'Times New Roman',
                size: 24,
              }),
              new TextRun({ text: '\t\t\t\t\t\t' }),
              new TextRun({
                text: 'BÊN B',
                bold: true,
                font: 'Times New Roman',
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '(Ký, ghi rõ họ tên)',
                font: 'Times New Roman',
                size: 22,
                italics: true,
              }),
              new TextRun({ text: '\t\t\t\t\t' }),
              new TextRun({
                text: '(Ký, ghi rõ họ tên)',
                font: 'Times New Roman',
                size: 22,
                italics: true,
              }),
            ],
          }),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(
    blob,
    `${contract.contract_no.replace(/\//g, '-')}_${contract.customer_name || contract.company_name}.docx`
  )
}
