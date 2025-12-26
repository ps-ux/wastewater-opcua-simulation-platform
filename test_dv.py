from asyncua import ua
from datetime import datetime

now = datetime.utcnow()
variant = ua.Variant(1.2, ua.VariantType.Double)

try:
    dv = ua.DataValue(variant)
    dv.SourceTimestamp = now
    print("Assigned SourceTimestamp successfully")
except Exception as e:
    print(f"Failed to assign SourceTimestamp: {e}")

try:
    dv2 = ua.DataValue(Value=variant, StatusCode_=ua.StatusCode(ua.StatusCodes.Good), SourceTimestamp=now)
    print("Created DataValue with keywords successfully")
except Exception as e:
    print(f"Failed to create DataValue with keywords: {e}")
