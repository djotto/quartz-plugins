# Explorer Override

A Quartz v5 component plugin containing the Explorer behavior overrides used by otton.org.

The component renders no markup. Its `afterDOMLoaded` script:

- initializes Explorer scroll state so Quartz does not auto-scroll to the active item; and
- closes a stale desktop Explorer when the layout crosses into the mobile breakpoint.
