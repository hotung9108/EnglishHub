import logging
import sys


def setup_logging():
    """
    Cấu hình Structured Logging cho EnglishHub AI Service.
    Tuân thủ Mục 7.2 của convention-ai.md.
    """
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] [%(name)s]: %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True
    )
    # Giảm log ồn ào từ các thư viện HTTP bên thứ ba
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("multipart").setLevel(logging.WARNING)
