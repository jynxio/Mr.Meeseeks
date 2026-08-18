pub(crate) fn u64_from_str<'de, D>(deserializer: D) -> Result<u64, D::Error>
where
    D: serde::Deserializer<'de>,
{
    <String as serde::Deserialize>::deserialize(deserializer)?
        .parse()
        .map_err(serde::de::Error::custom)
}
