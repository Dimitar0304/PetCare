namespace PetCare.Core.Models
{
    /// <summary>
    /// Generic wrapper representing a single page of results together with
    /// pagination metadata used by the client to render paging controls.
    /// </summary>
    /// <typeparam name="T">Type of items contained in the page.</typeparam>
    public class PagedResult<T>
    {
        /// <summary>Items contained in the current page.</summary>
        public List<T> Items { get; set; } = new();

        /// <summary>Total number of items across all pages that match the query.</summary>
        public int Total { get; set; }

        /// <summary>Current page number, starting at 1.</summary>
        public int Page { get; set; }

        /// <summary>Maximum number of items returned per page.</summary>
        public int PageSize { get; set; }
    }
}

