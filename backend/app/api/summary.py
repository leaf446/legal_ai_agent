"""
Summary API Endpoints
US8 - 진행 상태 요약 카드 (Progress Summary Cards)

Endpoints for generating and sharing case summary cards
"""

import logging
from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.core.dependencies import get_db, verify_case_read_access
from app.services.summary_card_service import SummaryCardService
from app.schemas.summary import CaseSummaryResponse


router = APIRouter(prefix="/cases/{case_id}/summary", tags=["Summary"])


def get_summary_service(db: Session = Depends(get_db)) -> SummaryCardService:
    """Dependency to get summary service"""
    return SummaryCardService(db)


@router.get("", response_model=CaseSummaryResponse)
async def get_case_summary(
    case_id: str,
    _: str = Depends(verify_case_read_access),
    service: SummaryCardService = Depends(get_summary_service)
):
    """
    Get case summary card data

    사건 진행 현황 요약 카드 데이터를 조회합니다.
    의뢰인에게 공유하기 위한 1장짜리 요약 정보입니다.
    """
    try:
        return service.generate_summary(case_id)
    except ValueError as e:
        logger.warning(f"Summary generation failed for case {case_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사건 요약을 생성할 수 없습니다"
        )


@router.get("/pdf", response_class=StreamingResponse)
async def get_case_summary_pdf(
    case_id: str,
    _: str = Depends(verify_case_read_access),
    service: SummaryCardService = Depends(get_summary_service)
):
    """
    Download case summary as PDF

    사건 진행 현황 요약 카드를 PDF로 다운로드합니다.
    A4 크기의 1페이지 PDF 파일입니다.
    """
    try:
        pdf_data = service.get_case_for_pdf(case_id)

        # Generate simple HTML-based PDF
        # Note: In production, use WeasyPrint or ReportLab for better PDF generation
        html_content = _generate_summary_html(pdf_data)

        # For MVP, return HTML that can be printed/saved as PDF
        # A full PDF implementation would use WeasyPrint or ReportLab
        return StreamingResponse(
            BytesIO(html_content.encode('utf-8')),
            media_type="text/html",
            headers={
                "Content-Disposition": f"attachment; filename=case_summary_{case_id}.html"
            }
        )

    except ValueError as e:
        logger.warning(f"Summary PDF generation failed for case {case_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사건 요약 PDF를 생성할 수 없습니다"
        )


def _generate_summary_html(data: dict) -> str:
    """Generate HTML for summary card"""

    completed_stages_html = ""
    for s in data["completed_stages"]:
        completed_stages_html += f"<li>{s['label']} ({s['date']})</li>\n"

    next_schedules_html = ""
    for s in data["next_schedules"]:
        next_schedules_html += f"""
        <div class="schedule-item">
            <strong>{s['event']}</strong><br>
            📅 {s['datetime']}<br>
            📍 {s['location']}
        </div>
        """

    evidence_stats_html = ""
    for e in data["evidence_stats"]:
        evidence_stats_html += f"<li>{e['category']}: {e['count']}건</li>\n"

    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>사건 진행 현황 요약 - {data['title']}</title>
    <style>
        @page {{
            size: A4;
            margin: 20mm;
        }}
        body {{
            font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            background: #fff;
            color: #333;
            line-height: 1.6;
        }}
        .header {{
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        .header h1 {{
            margin: 0;
            font-size: 24px;
            color: #1a1a1a;
        }}
        .header .subtitle {{
            font-size: 16px;
            color: #666;
            margin-top: 8px;
        }}
        .section {{
            margin-bottom: 25px;
        }}
        .section-title {{
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        .current-stage {{
            background: #f0f7ff;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin-bottom: 20px;
        }}
        .current-stage .label {{
            font-size: 14px;
            color: #666;
        }}
        .current-stage .value {{
            font-size: 20px;
            font-weight: bold;
            color: #1a1a1a;
        }}
        .progress-bar {{
            background: #e5e7eb;
            border-radius: 4px;
            height: 8px;
            margin-top: 10px;
            overflow: hidden;
        }}
        .progress-bar-fill {{
            background: #3b82f6;
            height: 100%;
            transition: width 0.3s;
        }}
        .completed-list {{
            list-style: none;
            padding: 0;
        }}
        .completed-list li {{
            padding: 8px 0;
            border-bottom: 1px solid #eee;
            display: flex;
            align-items: center;
        }}
        .completed-list li::before {{
            content: "✅";
            margin-right: 10px;
        }}
        .schedule-item {{
            background: #f9fafb;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 10px;
        }}
        .lawyer-info {{
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
        }}
        .footer {{
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 12px;
            color: #999;
        }}
        @media print {{
            body {{
                padding: 0;
            }}
            .no-print {{
                display: none;
            }}
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>사건 진행 현황 요약</h1>
        <div class="subtitle">{data['title']} ({data['court_reference']})</div>
    </div>

    <div class="current-stage">
        <div class="label">📍 현재 단계</div>
        <div class="value">{data['current_stage']}</div>
        <div class="progress-bar">
            <div class="progress-bar-fill" style="width: {data['progress_percent']}%"></div>
        </div>
        <div style="text-align: right; font-size: 12px; color: #666; margin-top: 5px;">
            진행률 {data['progress_percent']}%
        </div>
    </div>

    <div class="section">
        <div class="section-title">✅ 완료된 단계</div>
        <ul class="completed-list">
            {completed_stages_html if completed_stages_html else '<li style="color:#999;">아직 완료된 단계가 없습니다.</li>'}
        </ul>
    </div>

    <div class="section">
        <div class="section-title">📌 다음 일정</div>
        {next_schedules_html if next_schedules_html else '<p style="color:#999;">예정된 일정이 없습니다.</p>'}
    </div>

    <div class="section">
        <div class="section-title">📊 증거 현황</div>
        {f'<p>총 {data["evidence_total"]}건</p><ul>{evidence_stats_html}</ul>' if data['evidence_total'] > 0 else '<p style="color:#999;">등록된 증거가 없습니다.</p>'}
    </div>

    <div class="section">
        <div class="section-title">💬 담당 변호사</div>
        <div class="lawyer-info">
            <strong>{data['lawyer']['name']}</strong><br>
            📞 {data['lawyer']['phone']}<br>
            ✉️ {data['lawyer']['email']}
        </div>
    </div>

    <div class="footer">
        생성일시: {data['generated_at']}<br>
        본 문서는 의뢰인 정보 공유용으로 생성되었습니다.
    </div>
</body>
</html>"""
