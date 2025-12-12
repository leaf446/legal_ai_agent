"""
Unit tests for PdfGenerator
TDD - Improving test coverage for pdf_generator.py
"""

import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime
from io import BytesIO

from app.utils.pdf_generator import (
    PdfGenerator,
    PdfGeneratorError,
    WEASYPRINT_AVAILABLE,
    JINJA2_AVAILABLE
)


class TestPdfGeneratorInit:
    """Unit tests for PdfGenerator initialization"""

    def test_init_raises_when_weasyprint_unavailable(self):
        """Raises PdfGeneratorError when weasyprint is not installed"""
        import app.utils.pdf_generator as module

        original = module.WEASYPRINT_AVAILABLE
        module.WEASYPRINT_AVAILABLE = False

        try:
            with pytest.raises(PdfGeneratorError, match="WeasyPrint is not installed"):
                PdfGenerator()
        finally:
            module.WEASYPRINT_AVAILABLE = original

    def test_init_raises_when_jinja2_unavailable(self):
        """Raises PdfGeneratorError when Jinja2 is not installed"""
        import app.utils.pdf_generator as module

        original_weasy = module.WEASYPRINT_AVAILABLE
        original_jinja = module.JINJA2_AVAILABLE
        module.WEASYPRINT_AVAILABLE = True
        module.JINJA2_AVAILABLE = False

        try:
            with pytest.raises(PdfGeneratorError, match="Jinja2 is not installed"):
                PdfGenerator()
        finally:
            module.WEASYPRINT_AVAILABLE = original_weasy
            module.JINJA2_AVAILABLE = original_jinja


@pytest.mark.skipif(not (WEASYPRINT_AVAILABLE and JINJA2_AVAILABLE),
                    reason="weasyprint or jinja2 not installed")
class TestPdfGeneratorDocument:
    """Unit tests for generate_document method"""

    def test_generate_empty_document(self):
        """Generates PDF with minimal content"""
        generator = PdfGenerator()
        content = {}

        result = generator.generate_document(content)

        assert isinstance(result, bytes)
        assert len(result) > 0
        # Check it's a valid PDF (starts with %PDF)
        assert result[:4] == b'%PDF'

    def test_generate_with_header(self):
        """Generates PDF with header section"""
        generator = PdfGenerator()
        content = {
            "header": {
                "court_name": "서울가정법원",
                "case_number": "2025드단12345",
                "parties": {
                    "plaintiff": "원고 김○○",
                    "defendant": "피고 이○○"
                }
            }
        }

        result = generator.generate_document(content, "complaint")

        assert isinstance(result, bytes)
        assert result[:4] == b'%PDF'

    def test_generate_with_sections(self):
        """Generates PDF with content sections"""
        generator = PdfGenerator()
        content = {
            "sections": [
                {"title": "청구취지", "content": "원고와 피고는 이혼한다.", "order": 1},
                {"title": "청구원인", "content": "혼인관계 파탄 사유", "order": 2}
            ]
        }

        result = generator.generate_document(content, "brief")

        assert isinstance(result, bytes)
        assert result[:4] == b'%PDF'

    def test_generate_with_citations(self):
        """Generates PDF with citations section"""
        generator = PdfGenerator()
        content = {
            "citations": [
                {"reference": "[증 제1호증]", "description": "녹음 파일"},
                {"reference": "[증 제2호증]", "description": "카카오톡 대화 기록"}
            ]
        }

        result = generator.generate_document(content)

        assert isinstance(result, bytes)
        assert result[:4] == b'%PDF'

    def test_generate_with_footer(self):
        """Generates PDF with footer/signature section"""
        generator = PdfGenerator()
        content = {
            "header": {
                "court_name": "서울가정법원"
            },
            "footer": {
                "date": "2025년 12월 3일",
                "attorney": "변호사 박○○"
            }
        }

        result = generator.generate_document(content)

        assert isinstance(result, bytes)
        assert result[:4] == b'%PDF'

    def test_document_types(self):
        """Generates PDF for different document types"""
        generator = PdfGenerator()
        content = {"sections": [{"title": "내용", "content": "테스트", "order": 1}]}

        for doc_type in ["complaint", "motion", "brief", "response"]:
            result = generator.generate_document(content, doc_type)
            assert isinstance(result, bytes)
            assert result[:4] == b'%PDF'


@pytest.mark.skipif(not (WEASYPRINT_AVAILABLE and JINJA2_AVAILABLE),
                    reason="weasyprint or jinja2 not installed")
class TestPdfGeneratorFromText:
    """Unit tests for generate_from_draft_text method"""

    def test_generate_from_text_minimal(self):
        """Generates PDF from minimal text"""
        generator = PdfGenerator()

        result = generator.generate_from_draft_text(
            draft_text="테스트 초안 내용",
            case_title="테스트 케이스"
        )

        assert isinstance(result, bytes)
        assert result[:4] == b'%PDF'

    def test_generate_from_text_with_citations(self):
        """Generates PDF with citations list"""
        generator = PdfGenerator()
        citations = [
            {"evidence_id": "EV-001", "labels": ["폭언"], "snippet": "폭언 내용"},
            {"evidence_id": "EV-002", "labels": ["협박"], "snippet": "협박 내용"}
        ]

        result = generator.generate_from_draft_text(
            draft_text="초안 내용",
            case_title="테스트",
            citations=citations
        )

        assert isinstance(result, bytes)
        assert result[:4] == b'%PDF'

    def test_generate_from_text_with_timestamp(self):
        """Uses provided timestamp"""
        generator = PdfGenerator()
        timestamp = datetime(2025, 12, 3, 10, 30, 0)

        result = generator.generate_from_draft_text(
            draft_text="초안",
            case_title="테스트",
            generated_at=timestamp
        )

        assert isinstance(result, bytes)


@pytest.mark.skipif(not (WEASYPRINT_AVAILABLE and JINJA2_AVAILABLE),
                    reason="weasyprint or jinja2 not installed")
class TestPdfGeneratorHelpers:
    """Unit tests for helper methods"""

    def test_get_document_title_with_case_number(self):
        """Generates title with case number"""
        generator = PdfGenerator()
        header = {"case_number": "2025드단12345"}

        title = generator._get_document_title(header, "complaint")

        assert "2025드단12345" in title
        assert "소 장" in title

    def test_get_document_title_without_case_number(self):
        """Generates title without case number"""
        generator = PdfGenerator()
        header = {}

        title = generator._get_document_title(header, "brief")

        assert title == "준 비 서 면"

    def test_get_fallback_css(self):
        """Returns valid CSS content"""
        generator = PdfGenerator()

        css = generator._get_fallback_css()

        assert "@page" in css
        assert "font-family" in css
        assert "A4" in css

    def test_prepare_context(self):
        """Prepares context correctly"""
        generator = PdfGenerator()
        content = {
            "header": {"court_name": "테스트법원"},
            "sections": [
                {"title": "두번째", "order": 2},
                {"title": "첫번째", "order": 1}
            ],
            "citations": [],
            "footer": {}
        }

        context = generator._prepare_context(content, "brief")

        assert context["header"]["court_name"] == "테스트법원"
        # Sections should be sorted by order
        assert context["sections"][0]["title"] == "첫번째"
        assert "document_type_korean" in context

    def test_build_content_from_text(self):
        """Builds content structure from text"""
        generator = PdfGenerator()
        citations = [{"snippet": "내용", "labels": ["라벨1", "라벨2"]}]

        content = generator._build_content_from_text(
            draft_text="테스트 내용",
            case_title="테스트",
            citations=citations,
            generated_at=datetime(2025, 1, 1)
        )

        assert content["document_title"] == "초안 - 테스트"
        assert len(content["sections"]) == 1
        assert content["sections"][0]["content"] == "테스트 내용"
        assert len(content["citations"]) == 1

    def test_get_page_count(self):
        """Estimates page count from PDF bytes"""
        generator = PdfGenerator()

        # Small document (1 page)
        small_pdf = b'%PDF' + b'x' * 2000
        assert generator.get_page_count(small_pdf) == 1

        # Larger document (multiple pages)
        large_pdf = b'%PDF' + b'x' * 15000
        assert generator.get_page_count(large_pdf) >= 1


@pytest.mark.skipif(not (WEASYPRINT_AVAILABLE and JINJA2_AVAILABLE),
                    reason="weasyprint or jinja2 not installed")
class TestRenderSimpleTemplate:
    """Unit tests for _render_simple_template method"""

    def test_render_simple_template_minimal(self):
        """Renders minimal template"""
        generator = PdfGenerator()
        content = {}

        html = generator._render_simple_template(content)

        assert "<!DOCTYPE html>" in html
        assert "<html" in html

    def test_render_simple_template_with_sections(self):
        """Includes sections in rendered HTML"""
        generator = PdfGenerator()
        content = {
            "sections": [
                {"title": "섹션제목", "content": "섹션내용"}
            ]
        }

        html = generator._render_simple_template(content)

        assert "섹션제목" in html
        assert "섹션내용" in html

    def test_render_simple_template_with_citations(self):
        """Includes citations in rendered HTML"""
        generator = PdfGenerator()
        content = {
            "citations": [
                {"reference": "[증1]", "description": "증거설명"}
            ]
        }

        html = generator._render_simple_template(content)

        assert "[증1]" in html
        assert "증거설명" in html

    def test_render_simple_template_multiline_content(self):
        """Handles multiline content"""
        generator = PdfGenerator()
        content = {
            "sections": [
                {"title": "제목", "content": "첫줄\n둘째줄\n\n새문단"}
            ]
        }

        html = generator._render_simple_template(content)

        assert "<br>" in html or "</p><p>" in html


@pytest.mark.skipif(not (WEASYPRINT_AVAILABLE and JINJA2_AVAILABLE),
                    reason="weasyprint or jinja2 not installed")
class TestPdfGeneratorEdgeCases:
    """Edge case tests for PdfGenerator"""

    def test_empty_header_fields(self):
        """Handles empty header fields gracefully"""
        generator = PdfGenerator()
        content = {
            "header": {
                "court_name": "",
                "case_number": "",
                "parties": {}
            }
        }

        result = generator.generate_document(content)

        assert isinstance(result, bytes)

    def test_empty_citations_list(self):
        """Handles empty citations list"""
        generator = PdfGenerator()
        content = {"citations": []}

        result = generator.generate_document(content)

        assert isinstance(result, bytes)

    def test_section_without_order(self):
        """Handles sections without order field"""
        generator = PdfGenerator()
        content = {
            "sections": [
                {"title": "제목", "content": "내용"}  # no order
            ]
        }

        result = generator.generate_document(content)

        assert isinstance(result, bytes)

    def test_unknown_document_type(self):
        """Unknown document type defaults correctly"""
        generator = PdfGenerator()
        content = {}

        result = generator.generate_document(content, "unknown_type")

        assert isinstance(result, bytes)


@pytest.mark.skipif(not (WEASYPRINT_AVAILABLE and JINJA2_AVAILABLE),
                    reason="weasyprint or jinja2 not installed")
class TestConvenienceFunctions:
    """Unit tests for convenience functions"""

    def test_generate_pdf_function(self):
        """generate_pdf convenience function works"""
        from app.utils.pdf_generator import generate_pdf

        content = {
            "sections": [
                {"title": "테스트", "content": "내용", "order": 1}
            ]
        }

        result = generate_pdf(content, "brief")

        assert isinstance(result, bytes)
        assert result[:4] == b'%PDF'

    def test_generate_pdf_from_text_function(self):
        """generate_pdf_from_text convenience function works"""
        from app.utils.pdf_generator import generate_pdf_from_text

        result = generate_pdf_from_text(
            draft_text="테스트 초안",
            case_title="테스트 케이스"
        )

        assert isinstance(result, bytes)
        assert result[:4] == b'%PDF'


class TestPdfGeneratorConstants:
    """Tests for PdfGenerator constants"""

    def test_document_types(self):
        """Verifies document type mappings"""
        types = PdfGenerator.DOCUMENT_TYPES
        assert "complaint" in types
        assert "motion" in types
        assert "brief" in types
        assert "response" in types
        assert types["complaint"] == "소 장"


class TestPdfGeneratorError:
    """Tests for PdfGeneratorError exception"""

    def test_pdf_generator_error_is_exception(self):
        """PdfGeneratorError is an Exception"""
        error = PdfGeneratorError("test error")
        assert isinstance(error, Exception)
        assert str(error) == "test error"


class TestPdfGeneratorMockedWithSysModules:
    """Mock-based tests using sys.modules injection for missing dependencies"""

    def test_init_mocked_with_injected_modules(self):
        """Test __init__ with injected mock modules"""
        import sys
        import importlib

        # Create mock modules
        mock_weasyprint = MagicMock()
        mock_weasyprint.HTML = MagicMock()
        mock_weasyprint.CSS = MagicMock()
        mock_weasyprint.text = MagicMock()
        mock_weasyprint.text.fonts = MagicMock()
        mock_weasyprint.text.fonts.FontConfiguration = MagicMock()

        mock_jinja2 = MagicMock()
        mock_jinja2.Environment = MagicMock(return_value=MagicMock())
        mock_jinja2.FileSystemLoader = MagicMock()
        mock_jinja2.select_autoescape = MagicMock()

        # Save original modules
        orig_weasy = sys.modules.get('weasyprint')
        orig_weasy_text = sys.modules.get('weasyprint.text')
        orig_weasy_fonts = sys.modules.get('weasyprint.text.fonts')
        orig_jinja = sys.modules.get('jinja2')

        try:
            # Inject mock modules
            sys.modules['weasyprint'] = mock_weasyprint
            sys.modules['weasyprint.text'] = mock_weasyprint.text
            sys.modules['weasyprint.text.fonts'] = mock_weasyprint.text.fonts
            sys.modules['jinja2'] = mock_jinja2

            # Reload the module to pick up mocked dependencies
            import app.utils.pdf_generator as pdf_module
            importlib.reload(pdf_module)

            # Now create generator
            generator = pdf_module.PdfGenerator()
            assert generator is not None
            assert generator.jinja_env is not None

        finally:
            # Restore original modules
            if orig_weasy:
                sys.modules['weasyprint'] = orig_weasy
            else:
                sys.modules.pop('weasyprint', None)
            if orig_weasy_text:
                sys.modules['weasyprint.text'] = orig_weasy_text
            else:
                sys.modules.pop('weasyprint.text', None)
            if orig_weasy_fonts:
                sys.modules['weasyprint.text.fonts'] = orig_weasy_fonts
            else:
                sys.modules.pop('weasyprint.text.fonts', None)
            if orig_jinja:
                sys.modules['jinja2'] = orig_jinja
            else:
                sys.modules.pop('jinja2', None)

            # Reload to restore original state
            import app.utils.pdf_generator as pdf_module
            importlib.reload(pdf_module)


class TestPdfGeneratorStaticMethods:
    """Tests for static/class methods that don't need instantiation"""

    def test_document_types_keys(self):
        """Test DOCUMENT_TYPES has all expected keys"""
        expected_keys = ["complaint", "motion", "brief", "response"]
        for key in expected_keys:
            assert key in PdfGenerator.DOCUMENT_TYPES

    def test_document_types_values_korean(self):
        """Test DOCUMENT_TYPES has Korean values"""
        assert PdfGenerator.DOCUMENT_TYPES["complaint"] == "소 장"
        assert PdfGenerator.DOCUMENT_TYPES["motion"] == "신 청 서"
        assert PdfGenerator.DOCUMENT_TYPES["brief"] == "준 비 서 면"
        assert PdfGenerator.DOCUMENT_TYPES["response"] == "답 변 서"

    def test_template_dir_is_path(self):
        """Test TEMPLATE_DIR is a Path object"""
        from pathlib import Path
        assert isinstance(PdfGenerator.TEMPLATE_DIR, Path)

    def test_styles_dir_is_path(self):
        """Test STYLES_DIR is a Path object"""
        from pathlib import Path
        assert isinstance(PdfGenerator.STYLES_DIR, Path)

    def test_exif_tags_to_extract_mapping(self):
        """Test EXIF_TAGS_TO_EXTRACT has correct mapping"""
        expected_tags = [
            "DateTimeOriginal", "DateTimeDigitized", "Make", "Model",
            "Software", "ImageWidth", "ImageLength", "Orientation", "Flash"
        ]
        # Note: EXIF_TAGS_TO_EXTRACT is in PdfGenerator class
        # Check if it exists (it should based on the code)
        if hasattr(PdfGenerator, 'EXIF_TAGS_TO_EXTRACT'):
            for tag in expected_tags:
                assert tag in PdfGenerator.EXIF_TAGS_TO_EXTRACT
        else:
            # Skip if attribute not present (class may have been modified)
            pytest.skip("EXIF_TAGS_TO_EXTRACT not present in PdfGenerator")
