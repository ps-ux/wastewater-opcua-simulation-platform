from asyncua import ua
import inspect

dv = ua.DataValue()
print(f"DataValue fields: {dir(dv)}")
print(f"DataValue init signature: {inspect.signature(ua.DataValue.__init__)}")
