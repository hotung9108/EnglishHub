from datetime import datetime, timezone
from typing import Any, Generic, List, Optional, TypeVar
from pydantic import Field
from app.schemas.base import CamelModel

T = TypeVar("T")


class ErrorDetail(CamelModel):
    """Chi tiết lỗi của từng trường."""
    field: Optional[str] = None
    message: str


class ErrorResponse(CamelModel):
    """
    Response lỗi chuẩn hoá cho toàn bộ AI Service.
    Tuân thủ Mục 7.1 của convention-ai.md và common-conventions.md.
    Đồng thời hỗ trợ thuộc tính `detail` cho tương thích ngược với FastAPI mặc định.
    """
    success: bool = False
    code: str
    message: str
    detail: Optional[Any] = None
    errors: List[ErrorDetail] = Field(default_factory=list)
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def model_post_init(self, __context: Any) -> None:
        if self.detail is None and self.message:
            self.detail = self.message


class ApiResponse(CamelModel, Generic[T]):
    """Generic API envelope cho các response thành công khi cần đóng gói."""
    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
