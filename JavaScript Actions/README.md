# JavaScript Actions Support in PDF Form Fields

The PDF Viewer now supports Adobe AcroForm JavaScript format actions for text fields, enabling automatic formatting and validation of user input. This includes support for **Number**, **Percentage**, **Special**, and **Arbitrary Mask** formats through Adobe Form Helper scripts. To ensure document security, only supported Adobe helper functions are parsed and executed. Custom Scripts are not currently handled

## Key Features

- Support for Adobe AcroForm text field format actions.
- Typed JavaScript action model for PDF form fields.
- New `keyPressed` event support for handling user input during typing.
- Automatic parsing and execution of supported Adobe Form Helper scripts.
- Import, render, edit, and export forms containing supported AcroForm format actions.

## Supported Format Actions

### Number Format

Apply number formatting with configurable decimal precision, separators, negative number styling, and currency symbols.

#### Supported Scripts

```Javascript
AFNumber_Keystroke(decimals, separator, negative, 0, currency, prepend)
AFNumber_Format(decimals, separator, negative, 0, currency, prepend)
```

#### Parameters

| Parameter | Description |
| --- | --- |
| `decimals` | Number of digits displayed after the decimal separator |
| `separator` | Numeric separator style |
| `negative` | Negative number formatting style |
| `0` | Reserved parameter. Must always be `0` |
| `currency` | Currency symbol or unit |
| `prepend` | Determines whether the currency appears before or after the value |

#### Separator Styles

| Value | Example |
| --- | --- |
| 0 | 1,234.56 |
| 1 | 1234.56 |
| 2 | 1.234,56 |
| 3 | 1234,56 |

#### Negative Number Styles

| Value | Display |
| --- | --- |
| 0 | \-1234.56 (Black) |
| 1 | \-1234.56 (Red) |
| 2 | (1234.56) (Black) |
| 3 | (1234.56) (Red) |

#### Example

```Javascript
AFNumber_Format(2, 0, 0, 0, "$", true)
```

Displays:

```PlainText
$1,234.56
```

---

### Percentage Format

Apply percentage formatting with configurable decimal precision and separator styles.

#### Supported Scripts

```Javascript
AFPercent_Keystroke(decimals, separator)
AFPercent_Format(decimals, separator)
```

#### Parameters

| Parameter | Description |
| --- | --- |
| `decimals` | Number of decimal places |
| `separator` | Numeric separator style |

#### Example

```Javascript
AFPercent_Format(2, 0)
```

Input:

```PlainText
0.5
```

Output:

```PlainText
50.00%
```

> **Note:** Percentage formatting scales the committed value only once. Additional focus or blur operations do not reapply scaling.

---

### Special Format

Apply predefined formatting masks for common data types.

#### Supported Scripts

```Javascript
AFSpecial_Keystroke(type)
AFSpecial_Format(type)
```

#### Supported Types

| Type | Format | Example |
| --- | --- | --- |
| 0 | ZIP Code | 12345 |
| 1 | ZIP\+4 | 12345\-6789 |
| 2 | Phone Number | (123) 456\-7890 |
| 3 | Social Security Number | 123\-45\-6789 |

#### Examples

ZIP Code

```Javascript
AFSpecial_Format(0)
```

Phone Number

```Javascript
AFSpecial_Format(2)
```

Social Security Number

```Javascript
AFSpecial_Format(3)
```

> **Note:** Phone numbers support both 7\-digit (`456-7890`) and 10\-digit (`(123) 456-7890`) formats. Existing punctuation is automatically normalized before reapplying the mask.

---

### Arbitrary Mask Format

Apply custom masks for field input validation and formatting.

#### Supported Script

```Javascript
AFSpecial_KeystrokeEx("mask")
```

#### Supported Mask Tokens

| Token | Description |
| --- | --- |
| `9` | Numeric digit (0\-9) |
| `A` | Alphabetic character (A\-Z, a\-z) |
| `O` | Alphanumeric character |
| `X` | Any printable character |

#### Examples

License Number

```Javascript
AFSpecial_KeystrokeEx("AAA-9999")
```

Input:

```PlainText
ABC1234
```

Output:

```PlainText
ABC-1234
```

Product Code

```Javascript
AFSpecial_KeystrokeEx("AA-999-AA")
```

Input:

```PlainText
AB123CD
```

Output:

```PlainText
AB-123-CD
```

> **Note:** `AFSpecial_KeystrokeEx` does not provide a corresponding format action. The viewer reconstructs the display format using the configured mask during rendering.

## Adding Form Fields with Format Actions

The following example adds a text box with Number formatting support:

```Javascript
const numberField = {
    name: "Amount",
    bounds: { X: 150, Y: 200, Width: 200, Height: 24 },
    pageNumber: 1,
    actions: {
        keyPressed: {
            script: 'AFNumber_Keystroke(2, 0, 0, 0, "$", true)'
        },
        format: {
            script: 'AFNumber_Format(2, 0, 0, 0, "$", true)'
        }
    }
};

viewer.formDesignerModule.addFormField("Textbox", numberField);
```

## Supported Action Properties

```Javascript
actions: {
    keyPressed: {
        script: '...'
    },
    format: {
        script: '...'
    }
}
```

| Property | Description |
| --- | --- |
| `keyPressed` | Invoked during user input validation and masking |
| `format` | Invoked when formatting the committed field value |

## Security Considerations

To maintain document security:

- Only supported Adobe Form Helper functions are executed.
- Unsupported scripts are preserved during import and export but are not executed.
- Script parameters are parsed and validated before execution.

This implementation provides Acrobat\-compatible text field formatting while ensuring secure script handling within the PDF Viewer.

