# Security and privacy

No personal plan storage, account login, trading execution or data-provider credentials are implemented. Input is evaluated locally in a browser worker. Public historical-data requests reveal normal network metadata to their hosting provider. No analytics or third-party fonts are included.

Do not commit tokens, phone numbers, personal plans, full third-party historical datasets or local configuration. Report vulnerabilities without publishing credentials or private data. Until a private contact channel exists, a public issue should contain only a non-sensitive summary.

Input validation and a 50,000-observation bound are implemented. This is a browser/local research engine, not a hardened public API service; any future hosted service needs its own resource limits and abuse controls.

Data-source rights are independent of the MIT software license. Existing external histories carry unconfirmed display/redistribution status.
