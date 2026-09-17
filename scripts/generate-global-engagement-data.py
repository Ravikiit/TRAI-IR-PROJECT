"""Generate the typed, browser-safe map data projection from the authoritative workbook.

Run after replacing data/TRAI_IR_Global_Engagement_Map_Master.xlsx. The two activity
worksheets remain separate in the output; the UI derives all country roll-ups at runtime.
"""

import datetime
import json
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "TRAI_IR_Global_Engagement_Map_Master.xlsx"
TARGET = ROOT / "src" / "content" / "global-engagement-data.ts"


def value(cell):
    if isinstance(cell, (datetime.date, datetime.datetime)):
        return cell.strftime("%Y-%m-%d")
    return cell


def records(sheet, carry_forward=False):
    rows = list(sheet.values)
    headings = rows[0]
    previous = [None] * len(headings)
    output = []
    for source_row in rows[1:]:
        row = [value(item) for item in source_row]
        if carry_forward:
            for index in (0, 1):
                if row[index] is None:
                    row[index] = previous[index]
                else:
                    previous[index] = row[index]
        output.append(dict(zip(headings, row)))
    return output


def activity(record):
    return {
        "country": record["Country / Location"],
        "counterpart": record["Organisation / Counterpart"],
        "engagement": record["Activity / Engagement"],
        "dateDisplay": record["Date Display"],
        "startDate": record["Start Date"],
        "endDate": record["End Date"],
        "remarks": record["Original Date / Remarks"],
        "category": record["Map Category"],
    }


def country(record):
    return {
        "country": record["Country / Location"],
        "category": record["Map Category"],
        "hasMouLoi": record["MoU/LoI Status"] == "Yes",
        "sourceTotalActivities": record["Total Activities"],
        "firstEngagement": record["First Engagement"],
        "latestEngagement": record["Latest Engagement"],
    }


workbook = openpyxl.load_workbook(SOURCE, data_only=True)
mou_loi = [activity(row) for row in records(workbook["MoU_LoI Activities"], carry_forward=True)]
other = [activity(row) for row in records(workbook["Other Regulators"], carry_forward=True)]
master = [country(row) for row in records(workbook["Country Master"])]

content = "// Generated from data/TRAI_IR_Global_Engagement_Map_Master.xlsx. Do not edit manually.\n\n"
content += "export const mouLoiActivityRecords = " + json.dumps(mou_loi, ensure_ascii=False, indent=2) + " as const;\n\n"
content += "export const otherRegulatorActivityRecords = " + json.dumps(other, ensure_ascii=False, indent=2) + " as const;\n\n"
content += "export const countryMasterRecords = " + json.dumps(master, ensure_ascii=False, indent=2) + " as const;\n"
TARGET.write_text(content, encoding="utf-8")
