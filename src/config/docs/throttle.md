# Throttle 

You can setup throttle for multiple things (`rules`, `compositeRules`, `selfMonitoring`), it works same everytime.

## Schema Properties

| Property    | Type                   | Required | Description |
|-------------|------------------------|----------|-------------|
| `interval` | `string` | ✔️ | The throttle duration (e.g. `1m`, `1h`) after sending an alert. |
| `count`    | `number` | ❌ | The count threshold to bypass throttle, default to `0` (never send alert before the end of interval). |
| `activationThreshold`    | `number` | ❌ | The number of alerts allowed to be sent before the throttle to be activated. |


