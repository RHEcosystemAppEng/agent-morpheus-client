from typing import Any
from pydantic import BaseModel, Field

SUPPORTED_LANGUAGES = ['Go', 'Python', 'Dockerfile',
                       'Java', 'TypeScript', 'JavaScript']


class SourceInfo(BaseModel):
    type: str
    git_repo: str
    ref: str
    include: list[str]
    exclude: list[str] | None = None


class JsonSbomInfo(BaseModel):
    type: str = Field(serialization_alias='_type', default="json")
    format: str
    content: dict


class SbomPackage(BaseModel):
    name: str
    version: str
    purl: str | None = None


class ManualSbomInfo(BaseModel):
    type: str = Field(serialization_alias='_type', default="manual")
    packages: list[SbomPackage]


class Image(BaseModel):
    name: str
    tag: str
    source_info: list[SourceInfo]
    sbom_info: JsonSbomInfo | ManualSbomInfo


class Vuln(BaseModel):
    vuln_id: str


class Scan(BaseModel):
    vulns: list[Vuln]
    product_ref: str


class InputRequest(BaseModel):
    image: Image
    scan: Scan
