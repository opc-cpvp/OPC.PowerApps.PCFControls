import { Culture } from "./enums";

export class Utils {
 /**
     * Retrieves the label based on the current language.
     * Accepts the following formats:
     *   - Label
     *   - en=Label|fr=Étiquette
     */
    public static extractMultilingualText(text: string, currentCulture: Culture): string {
        if (text.indexOf("|") === -1)
            return text;

        // Load the translations from the label
        const translations = new Map<Culture, string>();
        for (const translation of text.split("|")) {
            const values: string[] = translation.split("=");

            // Check if the string is formatted correctly
            if (values.length !== 2)
                continue;

            // Check if the language is supported, if not don't add.
            const language: Culture = (<any>Culture)[values[0]];
            if (language === undefined)
                continue;

            const label: string = values[1];
            translations.set(language, label);
        }

        return translations.get(currentCulture) ?? "";
    }
}