import re
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """
    Base model hỗ trợ đọc/ghi tự động camelCase cho API và snake_case cho code Python.
    Tuân thủ Mục 3.4 & Mục 6 của .agents/rules/convention-ai.md.
    """
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True,
        from_attributes=True,
        str_strip_whitespace=True
    )

    def __getattr__(self, item: str):
        # Cho phép truy cập thuộc tính qua cả camelCase alias (vd: obj.overallScore -> obj.overall_score)
        snake_item = re.sub(r'(?<!^)(?=[A-Z])', '_', item).lower()
        if snake_item in self.__dict__:
            return self.__dict__[snake_item]
        raise AttributeError(f"'{type(self).__name__}' object has no attribute '{item}'")
