from __future__ import annotations

import io
import json

from app.execution.cpp_source import build_export_source
from app.models.execution import ExecutionCell
from app.models.notebook import NotebookCell


def export_notebook_cpp(cells: list[ExecutionCell]) -> str:
    return build_export_source(cells)


def export_notebook_cppnb(payload: dict) -> str:
    return json.dumps(payload, indent=2)


def export_notebook_pdf(cells: list[ExecutionCell] | list[NotebookCell], title: str) -> bytes:
    try:
        from datetime import datetime
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib.units import cm
        from reportlab.platypus import HRFlowable, Paragraph, Preformatted, SimpleDocTemplate, Spacer, Table, TableStyle
    except ImportError as exc:
        raise RuntimeError("PDF export requires reportlab. Install it in backend requirements.") from exc

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
        alignment=0,
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#64748b"),
    )
    badge_in_style = ParagraphStyle(
        "BadgeIn",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#4f46e5"),
    )
    badge_type_style = ParagraphStyle(
        "BadgeType",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#64748b"),
        alignment=2,
    )
    mono_style = ParagraphStyle(
        "CodeMono",
        parent=styles["Code"],
        fontName="Courier",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#0f172a"),
        backColor=colors.HexColor("#f8fafc"),
        borderColor=colors.HexColor("#cbd5e1"),
        borderWidth=0.75,
        borderPadding=8,
        borderRadius=4,
    )
    md_style = ParagraphStyle(
        "MarkdownBody",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#0f172a"),
    )
    output_style = ParagraphStyle(
        "OutputMono",
        parent=styles["Code"],
        fontName="Courier",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#0f172a"),
        backColor=colors.HexColor("#f1f5f9"),
        borderColor=colors.HexColor("#cbd5e1"),
        borderWidth=0.75,
        borderPadding=7,
        borderRadius=4,
    )
    output_error_style = ParagraphStyle(
        "OutputErrorMono",
        parent=styles["Code"],
        fontName="Courier",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#b91c1c"),
        backColor=colors.HexColor("#fef2f2"),
        borderColor=colors.HexColor("#fecaca"),
        borderWidth=0.75,
        borderPadding=7,
        borderRadius=4,
    )
    output_label_style = ParagraphStyle(
        "OutputLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        textColor=colors.HexColor("#334155"),
        leading=10,
    )

    story: list = []
    
    # Document Header Banner
    doc_title = title.strip() if title else "Untitled CppBook Notebook"
    story.append(Paragraph(doc_title, title_style))
    story.append(Spacer(1, 0.1 * cm))
    now_str = datetime.now().strftime("%B %d, %Y - %H:%M")
    story.append(Paragraph(f"Exported from CppBook &bull; {now_str} &bull; {len(cells)} cells", subtitle_style))
    story.append(Spacer(1, 0.2 * cm))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceAfter=12))

    for idx, cell in enumerate(cells, start=1):
        kind_label = "C++ Source" if cell.type == "code" else "Markdown"
        cell_header_table = Table(
            [[Paragraph(f"<b>[In {idx}]</b>", badge_in_style), Paragraph(kind_label, badge_type_style)]],
            colWidths=[doc.width * 0.5, doc.width * 0.5],
        )
        cell_header_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ("LINEBELOW", (0, 0), (-1, -1), 0.75, colors.HexColor("#cbd5e1")),
                ]
            )
        )
        story.append(cell_header_table)
        story.append(Spacer(1, 0.1 * cm))

        if cell.type == "code":
            story.append(Preformatted(cell.source or " ", mono_style))
        else:
            markdown_text = (
                (cell.source or "")
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\n", "<br/>")
            )
            story.append(Paragraph(markdown_text or " ", md_style))

        outputs = getattr(cell, "outputs", []) or []
        for output in outputs:
            if output.type == "input":
                continue
            label = output.type.upper()
            text = output.text or " "
            story.append(Spacer(1, 0.1 * cm))
            story.append(Paragraph(f"&gt; {label}", output_label_style))
            story.append(Spacer(1, 0.05 * cm))
            if output.type == "markdown":
                markdown_output = (
                    text.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\n", "<br/>")
                )
                story.append(Paragraph(markdown_output or " ", md_style))
            elif output.type == "stderr" or output.type == "error":
                story.append(Preformatted(text, output_error_style))
            else:
                story.append(Preformatted(text, output_style))

        story.append(Spacer(1, 0.45 * cm))

    doc.build(story)
    return buffer.getvalue()
