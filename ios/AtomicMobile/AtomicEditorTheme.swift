import Runestone
import UIKit

final class AtomicEditorTheme: Runestone.Theme {

    // MARK: - Base

    let font: UIFont = .preferredFont(forTextStyle: .body)
    let textColor: UIColor = .white

    // MARK: - Gutter (hidden)

    let gutterBackgroundColor: UIColor = .clear
    let gutterHairlineColor: UIColor = .clear
    let gutterHairlineWidth: CGFloat = 0
    let lineNumberColor: UIColor = .clear
    let lineNumberFont: UIFont = .preferredFont(forTextStyle: .body)
    let selectedLinesLineNumberColor: UIColor = .clear
    let selectedLinesGutterBackgroundColor: UIColor = .clear

    // MARK: - Selection / decoration

    let selectedLineBackgroundColor: UIColor = UIColor(white: 0.176, alpha: 1) // elevated
    let invisibleCharactersColor: UIColor = .clear
    let pageGuideHairlineColor: UIColor = .clear
    let pageGuideBackgroundColor: UIColor = .clear
    let markedTextBackgroundColor: UIColor = UIColor(white: 0.145, alpha: 1) // surface

    // MARK: - Highlight colors

    private let accentColor = UIColor(red: 0.486, green: 0.228, blue: 0.929, alpha: 1) // #7c3aed
    private let secondaryColor = UIColor(white: 0.55, alpha: 1)
    private let codeColor = UIColor(red: 0.6, green: 0.4, blue: 1.0, alpha: 1) // lighter purple

    func textColor(for rawHighlightName: String) -> UIColor? {
        switch rawHighlightName {
        case "text.title", "markup.heading":
            return accentColor
        case "text.literal", "markup.raw", "markup.raw.inline":
            return codeColor
        case "text.uri", "markup.link", "markup.link.url":
            return accentColor
        case "text.reference", "markup.link.label":
            return accentColor.withAlphaComponent(0.7)
        case "punctuation.special", "punctuation.definition":
            return secondaryColor
        case "punctuation.delimiter":
            return secondaryColor
        case "string.escape":
            return secondaryColor
        default:
            return nil
        }
    }

    func fontTraits(for rawHighlightName: String) -> FontTraits {
        switch rawHighlightName {
        case "text.strong", "markup.bold", "text.title", "markup.heading":
            return .bold
        case "text.emphasis", "markup.italic":
            return .italic
        default:
            return []
        }
    }

    func font(for rawHighlightName: String) -> UIFont? {
        nil
    }

    func shadow(for rawHighlightName: String) -> NSShadow? {
        nil
    }
}
