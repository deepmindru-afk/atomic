import Runestone
import SwiftUI
import TreeSitterMarkdownRunestone

struct MarkdownTextView: UIViewRepresentable {
    @Binding var text: String

    func makeCoordinator() -> Coordinator {
        Coordinator(text: $text)
    }

    func makeUIView(context: Context) -> Runestone.TextView {
        let textView = Runestone.TextView()
        textView.backgroundColor = UIColor(red: 0.118, green: 0.118, blue: 0.118, alpha: 1)
        textView.showLineNumbers = false
        textView.isLineWrappingEnabled = true
        textView.textContainerInset = UIEdgeInsets(top: 8, left: 12, bottom: 8, right: 12)
        textView.autocorrectionType = .default
        textView.autocapitalizationType = .sentences
        textView.editorDelegate = context.coordinator

        let theme = AtomicEditorTheme()
        let state = TextViewState(text: text, theme: theme, language: .markdown)
        textView.setState(state)

        return textView
    }

    func updateUIView(_ textView: Runestone.TextView, context: Context) {
        if textView.text != text {
            let theme = AtomicEditorTheme()
            let state = TextViewState(text: text, theme: theme, language: .markdown)
            textView.setState(state)
        }
    }

    final class Coordinator: TextViewDelegate {
        var text: Binding<String>

        init(text: Binding<String>) {
            self.text = text
        }

        func textViewDidChange(_ textView: Runestone.TextView) {
            text.wrappedValue = textView.text
        }
    }
}
