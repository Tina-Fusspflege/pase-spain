# Fixture pages

`app/lib/verified-fixtures.ts` is the reviewed public fixture catalog. Its entries
record an official source, review date, venue and confirmed local kickoff (or
provisional date). Recheck the club calendar when updating it. New seller offers
do not automatically establish calendar accuracy: review a new fixture and add
it to the catalog before indexing its page. Never copy a seller's midnight
placeholder as a confirmed kickoff.

The sitemap is built from this catalog without a live inventory query. Reviewed
pages remain available when tickets sell out, offers are deleted or Supabase
cannot be reached. Database failure displays unavailable inventory, not sold out.
Unreviewed offer URLs remain accessible with `noindex,follow`; their offers and
checkout are preserved. Conflicting seller dates are flagged, never silently
changed or assigned to a different game.

Only structured public seat fields are displayed by `offerFacts`. Missing seat
adjacency is unknown, not "yes"; prose such as "together, to be confirmed" is not
confirmation. Raw seller details, payouts and fee lines are never rendered on
these pages.
