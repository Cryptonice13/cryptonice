REVOKE EXECUTE ON FUNCTION public.create_prediction_market(text, text, numeric, text, timestamptz, timestamptz, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.place_prediction_order(uuid, text, integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_prediction_market(text, text, numeric, text, timestamptz, timestamptz, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.place_prediction_order(uuid, text, integer, integer) TO service_role;